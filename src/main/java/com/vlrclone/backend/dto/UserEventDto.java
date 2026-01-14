package com.vlrclone.backend.dto;

import java.time.LocalDateTime;

public class UserEventDto {

    public Long id;
    public String title;
    public String location;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public String status; // ATTENDED | GOING | MAYBE
    public String clubName;


    public UserEventDto() {}
}
