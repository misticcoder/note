package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ClubCategory;
import java.time.LocalDateTime;

public record ClubDto(
        Long id,
        String name,
        String description,
        ClubCategory category,
        LocalDateTime createdAt,
        long memberCount,
        long eventCount,

        // 🔹 Supervisor fields
        Long supervisorId,
        String supervisorName,
        String supervisorEmail
) {}
