package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_PROJECT_MANAGEMENT")
@Getter
@Setter
@NoArgsConstructor
public class ExpProjectManagement {

    @Id
    @Column(name = "PROJECT_MANAGEMENT_CODE", nullable = false, length = 100)
    private String projectManagementCode;

    @Column(name = "PROJECT_MANAGEMENT_NAME", length = 500)
    private String projectManagementName;
}
