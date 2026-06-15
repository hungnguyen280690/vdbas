package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_PROJECT_ITEM")
@Getter
@Setter
@NoArgsConstructor
public class ExpProjectItem {

    @Id
    @Column(name = "PROJECT_ITEM_CODE", nullable = false, length = 100)
    private String projectItemCode;

    @Column(name = "PROJECT_ITEM_NAME", length = 500)
    private String projectItemName;

    @Column(name = "PROJECT_CODE", length = 100)
    private String projectCode;

    @Column(name = "STATUS")
    private Integer status;
}
