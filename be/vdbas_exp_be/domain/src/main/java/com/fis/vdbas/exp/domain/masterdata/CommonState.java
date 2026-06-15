package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "COMMON_STATE")
@Getter
@Setter
@NoArgsConstructor
public class CommonState {

    @Id
    @Column(name = "STATE_CODE", nullable = false, length = 100)
    private String stateCode;

    @Column(name = "STATE_NAME", length = 500)
    private String stateName;

    @Column(name = "STATUS")
    private Integer status;

    @Column(name = "SUB_SYSTEM", length = 100)
    private String subSystem;
}
