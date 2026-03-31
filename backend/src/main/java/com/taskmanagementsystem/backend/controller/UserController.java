package com.taskmanagementsystem.backend.controller;

import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.UserRepository;
import com.taskmanagementsystem.backend.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<User> getMe(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).build();
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));


        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
    @PutMapping("/me")
    public ResponseEntity<User> updateName(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody User updatedUser) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).build();
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(updatedUser.getName());
        userRepository.save(user);

        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}