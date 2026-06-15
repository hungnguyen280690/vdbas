package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class DossierDetailDto extends DossierHeaderDto {
    private List<DocumentDetailDto> documents;
    private List<AttachmentInfoDto> attachments;
    private List<ApprovalLogEntryDto> approvalHistory;
}
