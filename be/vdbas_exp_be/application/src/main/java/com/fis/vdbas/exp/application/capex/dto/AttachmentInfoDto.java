package com.fis.vdbas.exp.application.capex.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AttachmentInfoDto {
    private UUID archiveId;
    private UUID dossierId;
    private String fileName;
    @JsonIgnore
    private String filePath;
    private String archiveType;
    private LocalDate archiveDate;
    private String note;
    private String downloadUrl;
    private String uploadedBy;
    private LocalDateTime uploadedDate;
    private String updatedBy;
    private LocalDateTime updatedDate;
}
