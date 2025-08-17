package com.vlrclone.backend.service;

import com.vlrclone.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public boolean userExists(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail).isPresent() ||
                userRepository.findByEmail(usernameOrEmail).isPresent();
    }
}
