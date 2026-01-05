package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.ClubMember;

import java.util.List;
import java.util.Locale;

public class UserClubDto {
    public Long id;
    public String name;
    public String logoUrl;
    public String role;
    public ClubCategory category;
    public Integer memberCount;
    public Integer eventCount;
}
