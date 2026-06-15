package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_DOCUMENT_TYPE")
@Getter
@Setter
@NoArgsConstructor
public class ExpDocumentType {

    @Id
    @Column(name = "DOCUMENT_TYPE_CODE", nullable = false, length = 100)
    private String documentTypeCode;

    @Column(name = "DOCUMENT_TYPE_NAME", length = 500)
    private String documentTypeName;

    @Column(name = "STATUS")
    private Integer status;
}
