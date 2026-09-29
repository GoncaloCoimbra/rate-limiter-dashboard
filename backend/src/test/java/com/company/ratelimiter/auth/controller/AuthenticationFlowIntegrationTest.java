package com.company.ratelimiter.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-flow;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.security.username=test-admin@example.com",
        "app.security.password=initial-password-123",
        "app.security.jwt-secret=test-only-secret-with-at-least-32-characters"
})
class AuthenticationFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void apiDocumentationRequiresAnAdminSession() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isForbidden());

        MvcResult login = login("test-admin@example.com", "initial-password-123");
        jakarta.servlet.http.Cookie session = login.getResponse().getCookie("rate-limiter-session");
        assertThat(session).isNotNull();

        mockMvc.perform(get("/v3/api-docs").cookie(session))
                .andExpect(status().isOk());
    }

    @Test
    void logoutRejectsTheSameSessionCookie() throws Exception {
        MvcResult login = login("test-admin@example.com", "initial-password-123");
        jakarta.servlet.http.Cookie session = login.getResponse().getCookie("rate-limiter-session");
        assertThat(session).isNotNull();

        mockMvc.perform(get("/api/auth/me").cookie(session))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/logout").cookie(session))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("rate-limiter-session", 0));

        mockMvc.perform(get("/api/auth/me").cookie(session))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void passwordResetTokenCanBeConsumedOnceAndNewPasswordWorks() throws Exception {
        String email = "reset-user@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Reset User\",\"email\":\"" + email + "\",\"password\":\"old-password-123\"}"))
                .andExpect(status().isOk());

        MvcResult forgot = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String resetLink = JsonPath.read(forgot.getResponse().getContentAsString(), "$.resetLink");
        String token = resetLink.substring(resetLink.indexOf("token=") + "token=".length());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"new-password-123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + email + "\",\"password\":\"old-password-123\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + email + "\",\"password\":\"new-password-123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"another-password-123\"}"))
                .andExpect(status().isBadRequest());
    }

    private MvcResult login(String username, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
    }
}
