package com.company.ratelimiter.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:api-exception-status;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.security.username=test-admin@example.com",
        "app.security.password=initial-password-123",
        "app.security.jwt-secret=test-only-secret-with-at-least-32-characters"
})
class ApiExceptionHandlerStatusTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void duplicateRegistrationReturnsConflict() throws Exception {
        String body = "{\"name\":\"Alice\",\"email\":\"duplicate@example.com\",\"password\":\"StrongPass123!\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void pausedPolicyRejectsNewApiKeyWithUnprocessableEntity() throws Exception {
        MvcResult policyResult = mockMvc.perform(post("/api/policies")
                        .principal(new UsernamePasswordAuthenticationToken("paused-user@example.com", "password", java.util.List.of()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Paused Policy\",\"description\":\"No access\",\"algorithm\":\"FIXED_WINDOW\",\"limit\":10,\"window\":\"MINUTE\",\"scope\":\"API_KEY\",\"status\":\"PAUSED\",\"usage\":0,\"environment\":\"DEVELOPMENT\",\"burst\":0}"))
                .andExpect(status().isCreated())
                .andReturn();

        Number policyIdValue = JsonPath.read(policyResult.getResponse().getContentAsString(), "$.id");
        Long policyId = policyIdValue.longValue();

        mockMvc.perform(post("/api/keys")
                        .principal(new UsernamePasswordAuthenticationToken("paused-user@example.com", "password", java.util.List.of()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Paused Key\",\"policyId\":" + policyId + "}"))
                .andExpect(status().isUnprocessableEntity());
    }
}
