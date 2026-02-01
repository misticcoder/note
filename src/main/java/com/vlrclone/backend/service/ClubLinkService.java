package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.LinkType;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.ClubLink;
import com.vlrclone.backend.repository.ClubLinkRepository;
import com.vlrclone.backend.repository.ClubRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClubLinkService {

    private final ClubRepository clubRepo;
    private final ClubLinkRepository linkRepo;

    public ClubLinkService(ClubRepository clubRepo, ClubLinkRepository linkRepo) {
        this.clubRepo = clubRepo;
        this.linkRepo = linkRepo;
    }


}
