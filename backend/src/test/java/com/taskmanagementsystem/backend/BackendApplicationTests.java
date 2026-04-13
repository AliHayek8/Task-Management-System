package com.taskmanagementsystem.backend;

import com.taskmanagementsystem.backend.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Lightweight smoke tests that don't require a database or full Spring context.
 * Controller and Service integration is covered by the dedicated test classes.
 */
@DisplayName("BackendApplication – smoke tests")
class BackendApplicationTests {

    @Test
    @DisplayName("JwtUtil can generate and validate a token without Spring context")
    void jwtUtil_standaloneRoundTrip() {
        JwtUtil jwtUtil = new JwtUtil();
        String token = jwtUtil.generateToken("test@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("JwtUtil rejects a tampered token")
    void jwtUtil_tamperedToken_isInvalid() {
        JwtUtil jwtUtil = new JwtUtil();
        String token   = jwtUtil.generateToken("user@example.com");
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";

        assertThat(jwtUtil.isTokenValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("JwtUtil throws IllegalArgumentException for an empty token string")
    void jwtUtil_emptyToken_isInvalid() {
        JwtUtil jwtUtil = new JwtUtil();
        // jjwt 0.11.x throws IAE on empty input — document the real contract
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jwtUtil.isTokenValid(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("JwtUtil generates different tokens for different emails")
    void jwtUtil_differentEmails_differentTokens() {
        JwtUtil jwtUtil = new JwtUtil();
        String t1 = jwtUtil.generateToken("a@example.com");
        String t2 = jwtUtil.generateToken("b@example.com");
        assertThat(t1).isNotEqualTo(t2);
    }

    @Test
    @DisplayName("JwtUtil extractEmail round-trips correctly for multiple users")
    void jwtUtil_extractEmail_multipleUsers() {
        JwtUtil jwtUtil = new JwtUtil();
        assertThat(jwtUtil.extractEmail(jwtUtil.generateToken("u1@x.com"))).isEqualTo("u1@x.com");
        assertThat(jwtUtil.extractEmail(jwtUtil.generateToken("u2@x.com"))).isEqualTo("u2@x.com");
    }
}
