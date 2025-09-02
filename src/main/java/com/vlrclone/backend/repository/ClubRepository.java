package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ClubRepository extends JpaRepository<Club, Long> {
    boolean existsByName(String name);
}

