package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_PROJECT")
@Getter
@Setter
@NoArgsConstructor
public class ExpProject {

    @Id
    @Column(name = "PROJECT_CODE", nullable = false, length = 100)
    private String projectCode;

    @Column(name = "PROJECT_NAME", length = 500)
    private String projectName;

    @Column(name = "PROJECT_TYPE_CODE", length = 100)
    private String projectTypeCode;

    @Column(name = "PROJECT_MANAGEMENT_CODE", length = 100)
    private String projectManagementCode;

    @Column(name = "INVESTOR_CODE", length = 100)
    private String investorCode;
}
