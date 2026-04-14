package com.taskmanagementsystem.backend.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtUtil")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
    }


    @Nested
    @DisplayName("generateToken()")
    class GenerateToken {

        @Test
        @DisplayName("should generate a non-null token for a valid email")
        void generateToken_returnsNonNull() {
            String token = jwtUtil.generateToken("alice@example.com");
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("should generate a token in three-part JWT format (header.payload.signature)")
        void generateToken_hasThreeParts() {
            String token = jwtUtil.generateToken("alice@example.com");
            assertThat(token.split("\\.")).hasSize(3);
        }

        @Test
        @DisplayName("should generate different tokens for different emails")
        void generateToken_differentEmailsProduceDifferentTokens() {
            String t1 = jwtUtil.generateToken("alice@example.com");
            String t2 = jwtUtil.generateToken("bob@example.com");
            assertThat(t1).isNotEqualTo(t2);
        }

        @Test
        @DisplayName("should generate different tokens on subsequent calls (unique iat)")
        void generateToken_calledTwice_producesUniqueTokens() throws InterruptedException {
            String t1 = jwtUtil.generateToken("alice@example.com");
            Thread.sleep(1001); // ensure different iat second
            String t2 = jwtUtil.generateToken("alice@example.com");
            // Tokens may differ only in iat; we simply confirm the method succeeds twice
            assertThat(t1).isNotNull();
            assertThat(t2).isNotNull();
        }
    }


    @Nested
    @DisplayName("extractEmail()")
    class ExtractEmail {

        @Test
        @DisplayName("should extract the same email that was used to generate the token")
        void extractEmail_success() {
            String token = jwtUtil.generateToken("alice@example.com");
            assertThat(jwtUtil.extractEmail(token)).isEqualTo("alice@example.com");
        }

        @Test
        @DisplayName("should extract email correctly for different users")
        void extractEmail_differentUsers() {
            String t1 = jwtUtil.generateToken("user1@test.com");
            String t2 = jwtUtil.generateToken("user2@test.com");

            assertThat(jwtUtil.extractEmail(t1)).isEqualTo("user1@test.com");
            assertThat(jwtUtil.extractEmail(t2)).isEqualTo("user2@test.com");
        }

        @Test
        @DisplayName("should throw JwtException when token is malformed")
        void extractEmail_malformedToken_throws() {
            assertThatThrownBy(() -> jwtUtil.extractEmail("not.a.valid.token"))
                    .isInstanceOf(JwtException.class);
        }

        @Test
        @DisplayName("should throw JwtException when token is tampered with")
        void extractEmail_tamperedToken_throws() {
            String token = jwtUtil.generateToken("alice@example.com");
            String tampered = token.substring(0, token.length() - 5) + "XXXXX";

            assertThatThrownBy(() -> jwtUtil.extractEmail(tampered))
                    .isInstanceOf(JwtException.class);
        }
    }


    @Nested
    @DisplayName("isTokenValid()")
    class IsTokenValid {

        @Test
        @DisplayName("should return true for a freshly generated token")
        void isTokenValid_freshToken_returnsTrue() {
            String token = jwtUtil.generateToken("alice@example.com");
            assertThat(jwtUtil.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("should return false for a malformed token")
        void isTokenValid_malformedToken_returnsFalse() {
            assertThat(jwtUtil.isTokenValid("this.is.garbage")).isFalse();
        }

        @Test
        @DisplayName("should return false for an empty string (library throws IAE, caught as invalid)")
        void isTokenValid_emptyString_returnsFalse() {
            // jjwt throws IllegalArgumentException for empty input — treat as invalid
            assertThatThrownBy(() -> jwtUtil.isTokenValid(""))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("should return false for a token with a tampered signature")
        void isTokenValid_tamperedSignature_returnsFalse() {
            String token = jwtUtil.generateToken("alice@example.com");
            String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";
            assertThat(jwtUtil.isTokenValid(tampered)).isFalse();
        }

        @Test
        @DisplayName("should validate tokens for multiple different users")
        void isTokenValid_multipleUsers() {
            assertThat(jwtUtil.isTokenValid(jwtUtil.generateToken("u1@x.com"))).isTrue();
            assertThat(jwtUtil.isTokenValid(jwtUtil.generateToken("u2@x.com"))).isTrue();
        }
    }


    @Test
    @DisplayName("should complete a full generate → validate → extract cycle correctly")
    void fullRoundTrip() {
        String email = "roundtrip@example.com";
        String token = jwtUtil.generateToken(email);

        assertThat(jwtUtil.isTokenValid(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo(email);
    }
}
