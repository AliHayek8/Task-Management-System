package com.taskmanagementsystem.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagementsystem.backend.dto.AuthResponse;
import com.taskmanagementsystem.backend.dto.LoginRequest;
import com.taskmanagementsystem.backend.dto.RegisterRequest;
import com.taskmanagementsystem.backend.security.JwtAuthFilter;
import com.taskmanagementsystem.backend.security.JwtUtil;
import com.taskmanagementsystem.backend.service.AuthService;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired MockMvc        mockMvc;
    @Autowired ObjectMapper   objectMapper;

    @MockBean AuthService         authService;
    @MockBean JwtUtil             jwtUtil;
    @MockBean JwtAuthFilter       jwtAuthFilter;
    @MockBean UserDetailsService  userDetailsService;

    private static final AuthResponse MOCK_RESPONSE =
            new AuthResponse(1L, "jwt-token", "Alice Smith", "alice@example.com");

    // ─── POST /api/auth/register ───────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("should return 200 and AuthResponse on successful registration")
        void register_success() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("Alice Smith");
            req.setEmail("alice@example.com");
            req.setPassword("secret123");

            when(authService.register(any(RegisterRequest.class))).thenReturn(MOCK_RESPONSE);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("jwt-token"))
                    .andExpect(jsonPath("$.email").value("alice@example.com"))
                    .andExpect(jsonPath("$.name").value("Alice Smith"))
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void register_blankName_returns400() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("");
            req.setEmail("alice@example.com");
            req.setPassword("secret123");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when email format is invalid")
        void register_invalidEmail_returns400() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("Alice");
            req.setEmail("not-an-email");
            req.setPassword("secret123");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when password is shorter than 6 characters")
        void register_shortPassword_returns400() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("Alice");
            req.setEmail("alice@example.com");
            req.setPassword("123");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when email already exists (service throws)")
        void register_duplicateEmail_returns400() throws Exception {
            RegisterRequest req = new RegisterRequest();
            req.setName("Alice");
            req.setEmail("alice@example.com");
            req.setPassword("secret123");

            when(authService.register(any())).thenThrow(new RuntimeException("Email already exists"));

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Email already exists"));
        }
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("should return 200 and AuthResponse on valid credentials")
        void login_success() throws Exception {
            LoginRequest req = new LoginRequest();
            req.setEmail("alice@example.com");
            req.setPassword("secret123");

            when(authService.login(any(LoginRequest.class))).thenReturn(MOCK_RESPONSE);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("jwt-token"))
                    .andExpect(jsonPath("$.email").value("alice@example.com"));
        }

        @Test
        @DisplayName("should return 400 when email field is blank")
        void login_blankEmail_returns400() throws Exception {
            LoginRequest req = new LoginRequest();
            req.setEmail("");
            req.setPassword("secret123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when password field is blank")
        void login_blankPassword_returns400() throws Exception {
            LoginRequest req = new LoginRequest();
            req.setEmail("alice@example.com");
            req.setPassword("");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when credentials are wrong (service throws)")
        void login_badCredentials_returns400() throws Exception {
            LoginRequest req = new LoginRequest();
            req.setEmail("alice@example.com");
            req.setPassword("wrongpass");

            when(authService.login(any())).thenThrow(new BadCredentialsException("Bad credentials"));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }
}
