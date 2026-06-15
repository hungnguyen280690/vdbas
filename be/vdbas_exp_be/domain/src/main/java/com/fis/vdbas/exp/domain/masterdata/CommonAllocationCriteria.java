package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "COMMON_ALLOCATION_CRITERIA")
@Getter
@Setter
@NoArgsConstructor
public class CommonAllocationCriteria {

    @Id
    @Column(name = "ALLOCATION_CRITERIA_CODE", nullable = false, length = 100)
    private String allocationCriteriaCode;

    @Column(name = "ALLOCATION_CRITERIA_NAME", length = 500)
    private String allocationCriteriaName;
}
