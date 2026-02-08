package com.vlrclone.backend.controller;


import com.vlrclone.backend.dto.UserSummaryDto;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.model.User.Role;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")

public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public List<UserSummaryDto> getAllUsers() {

        return users.findAll()
                .stream()
                .map(u -> new UserSummaryDto(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getRole().name()
                ))
                .toList();

    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User body) {

        if (body.getEmail() == null || body.getUsername() == null || body.getPassword() == null
                || body.getEmail().isBlank() || body.getUsername().isBlank() || body.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email, username, and password are required"));
        }

        if (users.existsByEmail(body.getEmail())) {
            return ResponseEntity.status(409).body(Map.of("message", "Email already in use"));
        }
        if (users.existsByUsername(body.getUsername())) {
            return ResponseEntity.status(409).body(Map.of("message", "Username already in use"));
        }

        Role role = body.getRole() != null ? body.getRole() : User.Role.STUDENT;
        body.setRole(role);

        // ✅ ENCODE PASSWORD
        body.setPassword(passwordEncoder.encode(body.getPassword()));

        User saved = users.save(body);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "user", Map.of(
                        "id", saved.getId(),
                        "email", saved.getEmail(),
                        "username", saved.getUsername(),
                        "role", saved.getRole().name()
                )
        ));
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User body) {

        String email = body.getEmail();
        String rawPassword = body.getPassword();

        if (email == null || rawPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "email and password required"));
        }

        return users.findByEmail(email)
                .<ResponseEntity<?>>map(u -> {

                    // ✅ PROPER PASSWORD CHECK
                    if (!passwordEncoder.matches(rawPassword, u.getPassword())) {
                        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
                    }

                    return ResponseEntity.ok(Map.of(
                            "status", "success",
                            "user", Map.of(
                                    "id", u.getId(),
                                    "email", u.getEmail(),
                                    "username", u.getUsername(),
                                    "role", u.getRole().name()
                            )
                    ));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }


    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteById(@PathVariable Long id) {
        return users.findById(id)
                .map(u -> {
                    if (u.isProtectedAccount()) {
                        return ResponseEntity.status(403).body(Map.of("message", "This account is protected and cannot be deleted"));
                    }
                    users.delete(u);
                    return ResponseEntity.ok(Map.of("status", "success"));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @DeleteMapping("/users/by-email")
    public ResponseEntity<?> deleteByEmail(@RequestParam String email) {
        return users.findByEmail(email)
                .map(u -> {
                    if (u.isProtectedAccount()) {
                        return ResponseEntity.status(403).body(Map.of("message", "This account is protected and cannot be deleted"));
                    }
                    users.delete(u);
                    return ResponseEntity.ok(Map.of("status", "success"));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String roleRaw = body.get("role");

        if (roleRaw == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "role is required"));
        }

        Role role;
        try {
            role = Role.valueOf(roleRaw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        return users.findById(id)
                .map(u -> {
                    if (u.isProtectedAccount()) {
                        return ResponseEntity.status(403)
                                .body(Map.of("message", "This account role cannot be changed"));
                    }

                    u.setRole(role);
                    users.save(u);

                    return ResponseEntity.ok(Map.of(
                            "status", "success",
                            "user", Map.of(
                                    "id", u.getId(),
                                    "role", u.getRole().name()
                            )
                    ));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }


}


