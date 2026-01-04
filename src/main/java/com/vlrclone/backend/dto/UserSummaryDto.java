package com.vlrclone.backend.dto;

public record UserSummaryDto(
        Long id,
        String username,
        String email,
        String role
) {}

