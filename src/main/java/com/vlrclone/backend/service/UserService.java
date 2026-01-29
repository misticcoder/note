package com.vlrclone.backend.service;

import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepo;

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public User getUserById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + id)
                );
    }
}
