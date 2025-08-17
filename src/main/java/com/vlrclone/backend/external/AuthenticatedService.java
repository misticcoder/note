package com.vlrclone.backend.external;

public interface AuthenticatedService {
    String login(String email, String password);
}
