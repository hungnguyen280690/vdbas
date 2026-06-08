package com.fis.vdbas.qtdc.application.user.dto;

import lombok.Data;

@Data
public class UserResetPasswordDto {
    private String newPassword;
    private Boolean requirePasswordChange;
}
