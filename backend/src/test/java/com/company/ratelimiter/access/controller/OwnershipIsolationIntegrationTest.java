package com.company.ratelimiter.access.controller;

import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.company.ratelimiter.auth.entity.AppUser;
import com.company.ratelimiter.auth.repository.AppUserRepository;
import com.company.ratelimiter.access.repository.RateClientRepository;
import com.company.ratelimiter.settings.repository.DashboardSettingRepository;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ownership;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.security.username=admin",
        "app.security.password=ci-admin-password",
        "app.security.jwt-secret=ci-only-secret-with-at-least-32-characters"
})
class OwnershipIsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RateClientRepository clientRepository;

    @Autowired
    private DashboardSettingRepository settingRepository;

    private Cookie userACookie;
    private Cookie userBCookie;

    @BeforeEach
    void createUsersAndClearResources() throws Exception {
        settingRepository.deleteAll();
        clientRepository.deleteAll();
        userRepository.deleteAll();

        userACookie = login("a-" + UUID.randomUUID() + "@example.com", "password-123");
        userBCookie = login("b-" + UUID.randomUUID() + "@example.com", "password-123");
    }

    @Test
    void userCannotReadUpdateOrDeleteAnotherUsersClientOrSetting() throws Exception {
        MvcResult clientResult = mockMvc.perform(post("/api/clients")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Client A\",\"identifier\":\"client-a-" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        Number clientIdValue = com.jayway.jsonpath.JsonPath.read(clientResult.getResponse().getContentAsString(), "$.id");
        long clientId = clientIdValue.longValue();

        mockMvc.perform(put("/api/settings/theme")
                        .cookie(userACookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"dark\""))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/clients").cookie(userBCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));
        mockMvc.perform(get("/api/settings").cookie(userBCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));
        mockMvc.perform(get("/api/clients/" + clientId).cookie(userBCookie))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/settings/theme").cookie(userBCookie))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/clients/" + clientId)
                        .cookie(userBCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hijacked\",\"identifier\":\"hijacked\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/settings/theme")
                        .cookie(userBCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"light\""))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/clients/" + clientId).cookie(userBCookie))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/settings/theme").cookie(userBCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/clients/" + clientId).cookie(userACookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Client A"));
        mockMvc.perform(get("/api/settings/theme").cookie(userACookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("dark"));
    }

    private Cookie login(String email, String password) throws Exception {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(email.contains("a-") ? "User A" : "User B");
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("USER");
        userRepository.saveAndFlush(user);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        return result.getResponse().getCookie("rate-limiter-session");
    }
}
