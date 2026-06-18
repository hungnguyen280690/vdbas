package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Nguồn gốc hồ sơ — map bảng {@code EXP_DATA_SOURCE} (chỉ đọc). */
@Entity
@Table(name = "EXP_DATA_SOURCE")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDataSource {

    @Id
    @Column(name = "DATA_SOURCE_CODE", length = 100)
    private String dataSourceCode;

    @Column(name = "DATA_SOURCE_NAME", length = 500)
    private String dataSourceName;

    @Column(name = "IS_DEFAULT")
    private Integer isDefault;
}
