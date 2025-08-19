package com.vlrclone.backend.controller;


import com.vlrclone.backend.model.User;
import com.vlrclone.backend.model.Role;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")

public class AuthController {
    private final UserRepository users;

    public AuthController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return users.findAll();
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User body) {
        // Basic validation
        if (body.getEmail() == null || body.getUsername() == null || body.getPassword() == null
                || body.getEmail().isBlank() || body.getUsername().isBlank() || body.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email, username, and password are required"));
        }

        // Duplicates
        if (users.existsByEmail(body.getEmail())) {
            return ResponseEntity.status(409).body(Map.of("message", "Email already in use"));
        }
        if (users.existsByUsername(body.getUsername())) {
            return ResponseEntity.status(409).body(Map.of("message", "Username already in use"));
        }

        // Default role if none provided
        Role role = body.getRole() != null ? body.getRole() : Role.STUDENT;
        body.setRole(role);

        // NOTE: For prototype only; password is plain text.
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
        String password = body.getPassword();

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "email and password required"));
        }

        return users.findByEmail(email)
                .<ResponseEntity<?>>map(u -> {
                    if (!u.getPassword().equals(password)) {
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
}
