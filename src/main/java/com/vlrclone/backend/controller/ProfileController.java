package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.UserEventDto;
import com.vlrclone.backend.dto.UserProfileDto;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.service.CurrentUserService;
import com.vlrclone.backend.service.UserProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final UserProfileService profileService;
    private final CurrentUserService currentUser;

    public ProfileController(UserProfileService profileService,
                             CurrentUserService currentUser) {
        this.profileService = profileService;
        this.currentUser = currentUser;
    }

    @GetMapping("/profile")
    public UserProfileDto myProfile(@RequestParam String email) {
        User user = currentUser.requireUserByEmail(email);
        return profileService.getProfile(user.getId());
    }

    @GetMapping("/events")
    public List<UserEventDto> myEvents(@RequestParam String email) {
        User user = currentUser.requireUserByEmail(email);
        return profileService.getUserEvents(user.getId());
    }

}
