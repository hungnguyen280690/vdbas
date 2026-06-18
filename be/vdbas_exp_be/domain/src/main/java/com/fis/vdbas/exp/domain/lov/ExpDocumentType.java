package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Loại chứng từ — map bảng {@code EXP_DOCUMENT_TYPE} (chỉ đọc). */
@Entity
@Table(name = "EXP_DOCUMENT_TYPE")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDocumentType {

    @Id
    @Column(name = "DOCUMENT_TYPE_CODE", length = 100)
    private String documentTypeCode;

    @Column(name = "DOCUMENT_TYPE_NAME", length = 500)
    private String documentTypeName;
}
