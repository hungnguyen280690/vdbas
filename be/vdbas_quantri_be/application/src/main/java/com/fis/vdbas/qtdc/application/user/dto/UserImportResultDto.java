package com.fis.vdbas.qtdc.application.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserImportResultDto {

    private int totalRows;
    private int successCount;
    private int failCount;
    private List<RowError> errors;
    private String reportBase64;

    @Data
    @AllArgsConstructor
    public static class RowError {
        private int row;
        private String username;
        private String reason;
    }
}
