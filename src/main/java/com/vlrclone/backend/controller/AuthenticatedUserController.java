package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.*;

public class AuthenticatedUserController {
    Context context;
    public AuthenticatedUserController(Context context) {
        this.context = context;
    }

    public void logout(){
        context.setCurrentUser(new Guest());
    }
}
