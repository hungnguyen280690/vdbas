package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AttachmentInfoDto {
    private UUID archiveId;
    private String fileName;
    private String docType;
    private String note;
    private Long fileSize;
    private String uploadedBy;
    private LocalDateTime uploadedDate;
}
