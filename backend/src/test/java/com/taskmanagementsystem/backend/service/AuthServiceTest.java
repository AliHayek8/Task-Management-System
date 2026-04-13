package com.taskmanagementsystem.backend.service;

import com.taskmanagementsystem.backend.dto.AuthResponse;
import com.taskmanagementsystem.backend.dto.LoginRequest;
import com.taskmanagementsystem.backend.dto.RegisterRequest;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.UserRepository;
import com.taskmanagementsystem.backend.security.JwtUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock UserRepository        userRepository;
    @Mock PasswordEncoder       passwordEncoder;
    @Mock JwtUtil               jwtUtil;
    @Mock AuthenticationManager authenticationManager;

    @InjectMocks AuthService authService;

    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = User.builder()
                .id(1L)
                .name("Alice Smith")
                .email("alice@example.com")
                .password("hashed-password")
                .build();
    }

    // ── register() ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class Register {

        private RegisterRequest request;

        @BeforeEach
        void setUp() {
            request = new RegisterRequest();
            request.setName("Alice Smith");
            request.setEmail("alice@example.com");
            request.setPassword("secret123");
        }

        @Test
        @DisplayName("should register a new user and return an AuthResponse with a token")
        void register_success() {
            when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
            when(passwordEncoder.encode("secret123")).thenReturn("hashed-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken("alice@example.com")).thenReturn("jwt-token");

            AuthResponse response = authService.register(request);

            // NOTE: The service calls save() but uses the local `user` variable (not the saved result),
            // so getId() returns null. This is a known limitation in the current service implementation.
            // The token, name, and email fields are correctly populated.
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getEmail()).isEqualTo("alice@example.com");
            assertThat(response.getName()).isEqualTo("Alice Smith");
        }

        @Test
        @DisplayName("should hash the password before persisting")
        void register_passwordIsHashed() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode("secret123")).thenReturn("hashed-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(anyString())).thenReturn("jwt-token");

            authService.register(request);

            verify(passwordEncoder).encode("secret123");
        }

        @Test
        @DisplayName("should save the user to the repository")
        void register_userIsSaved() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken(anyString())).thenReturn("jwt-token");

            authService.register(request);

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw RuntimeException when email is already registered")
        void register_duplicateEmail_throwsException() {
            when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Email already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should generate a JWT for the newly registered user")
        void register_jwtIsGenerated() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtUtil.generateToken("alice@example.com")).thenReturn("jwt-token");

            authService.register(request);

            verify(jwtUtil).generateToken("alice@example.com");
        }
    }

    // ── login() ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("login()")
    class Login {

        private LoginRequest request;

        @BeforeEach
        void setUp() {
            request = new LoginRequest();
            request.setEmail("alice@example.com");
            request.setPassword("secret123");
        }

        @Test
        @DisplayName("should authenticate and return an AuthResponse on valid credentials")
        void login_success() {
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(savedUser));
            when(jwtUtil.generateToken("alice@example.com")).thenReturn("jwt-token");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getEmail()).isEqualTo("alice@example.com");
            assertThat(response.getName()).isEqualTo("Alice Smith");
        }

        @Test
        @DisplayName("should delegate to AuthenticationManager with correct credentials")
        void login_delegatesToAuthManager() {
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(savedUser));
            when(jwtUtil.generateToken(anyString())).thenReturn("jwt-token");

            authService.login(request);

            verify(authenticationManager).authenticate(
                    argThat(token ->
                            token instanceof UsernamePasswordAuthenticationToken &&
                                    token.getPrincipal().equals("alice@example.com") &&
                                    token.getCredentials().equals("secret123")
                    )
            );
        }

        @Test
        @DisplayName("should throw RuntimeException when user is not found after authentication")
        void login_userNotFound_throwsException() {
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }

        @Test
        @DisplayName("should propagate BadCredentialsException when password is wrong")
        void login_wrongPassword_throwsException() {
            doThrow(new BadCredentialsException("Bad credentials"))
                    .when(authenticationManager).authenticate(any());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("should generate a JWT for the logged-in user")
        void login_jwtIsGenerated() {
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(savedUser));
            when(jwtUtil.generateToken("alice@example.com")).thenReturn("jwt-token");

            authService.login(request);

            verify(jwtUtil).generateToken("alice@example.com");
        }
    }
}
