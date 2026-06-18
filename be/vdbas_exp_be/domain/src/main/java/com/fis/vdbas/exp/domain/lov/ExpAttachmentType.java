package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Loại đính kèm — map bảng {@code EXP_ATTACHMENT_TYPE} (chỉ đọc). */
@Entity
@Table(name = "EXP_ATTACHMENT_TYPE")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpAttachmentType {

    @Id
    @Column(name = "ATTACHMENT_TYPE_CODE", length = 100)
    private String attachmentTypeCode;

    @Column(name = "ATTACHMENT_TYPE_NAME", length = 500)
    private String attachmentTypeName;
}
