package com.vlrclone.backend.dto;

import java.time.LocalDateTime;

public class MyEventDto {
    public Long id;
    public String title;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public String location;
    public String status; // GOING | MAYBE | ATTENDED
}
