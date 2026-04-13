package com.taskmanagementsystem.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.UserRepository;
import com.taskmanagementsystem.backend.security.JwtAuthFilter;
import com.taskmanagementsystem.backend.security.JwtUtil;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean UserRepository     userRepository;
    @MockBean JwtUtil            jwtUtil;
    @MockBean JwtAuthFilter      jwtAuthFilter;
    @MockBean UserDetailsService userDetailsService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .id(1L)
                .name("Alice Smith")
                .email("alice@example.com")
                .password("hash")
                .build();
    }

    // ── GET /api/users/me ─────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/users/me")
    class GetMe {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and the authenticated user (without password)")
        void getMe_success() throws Exception {
            when(jwtUtil.extractEmail("valid-token")).thenReturn("alice@example.com");
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));

            mockMvc.perform(get("/api/users/me")
                            .header("Authorization", "Bearer valid-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.name").value("Alice Smith"))
                    .andExpect(jsonPath("$.email").value("alice@example.com"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 403 when Authorization header is missing")
        void getMe_missingAuthHeader_returns403() throws Exception {
            // Controller itself checks for header and returns 403 directly
            mockMvc.perform(get("/api/users/me"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 403 when Authorization header does not start with 'Bearer '")
        void getMe_invalidAuthHeaderFormat_returns403() throws Exception {
            mockMvc.perform(get("/api/users/me")
                            .header("Authorization", "Token valid-token"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when user from token is not found in DB")
        void getMe_userNotFound_returns400() throws Exception {
            when(jwtUtil.extractEmail("valid-token")).thenReturn("ghost@x.com");
            when(userRepository.findByEmail("ghost@x.com")).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/users/me")
                            .header("Authorization", "Bearer valid-token"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ── PUT /api/users/me ─────────────────────────────────────────────────

    @Nested
    @DisplayName("PUT /api/users/me")
    class UpdateMe {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and the updated user when name is changed")
        void updateMe_success() throws Exception {
            User updated = User.builder()
                    .id(1L).name("Alice Updated")
                    .email("alice@example.com").password(null).build();

            when(jwtUtil.extractEmail("valid-token")).thenReturn("alice@example.com");
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
            when(userRepository.save(any(User.class))).thenReturn(updated);

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", "Bearer valid-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updated)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Alice Updated"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 403 when Authorization header is missing")
        void updateMe_missingHeader_returns403() throws Exception {
            mockMvc.perform(put("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(alice)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when user from token is not found")
        void updateMe_userNotFound_returns400() throws Exception {
            when(jwtUtil.extractEmail("valid-token")).thenReturn("ghost@x.com");
            when(userRepository.findByEmail("ghost@x.com")).thenReturn(Optional.empty());

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", "Bearer valid-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(alice)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("should persist the updated name via userRepository.save()")
        void updateMe_saveIsCalled() throws Exception {
            when(jwtUtil.extractEmail("valid-token")).thenReturn("alice@example.com");
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
            when(userRepository.save(any(User.class))).thenReturn(alice);

            User payload = User.builder().name("New Name").build();

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", "Bearer valid-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload)))
                    .andExpect(status().isOk());

            verify(userRepository).save(argThat(u -> "New Name".equals(u.getName())));
        }
    }
}
