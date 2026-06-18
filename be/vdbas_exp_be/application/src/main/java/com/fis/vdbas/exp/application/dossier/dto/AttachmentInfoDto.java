package com.fis.vdbas.exp.application.dossier.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Thông tin file đính kèm (schema {@code AttachmentInfo}) — KHÔNG expose filePath. */
@Data
public class AttachmentInfoDto {

    private UUID id;
    private String attachmentTypeCode;
    private String attachmentTypeName;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileSizeDisplay;
    private String description;
    private String createdBy;
    private LocalDateTime createdDate;
}
