package com.fis.vdbas.exp.domain.category;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import com.fis.vdbas.exp.domain.base.ExpAuditing;

@Entity
@Table(name = "category_groups")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class CategoryGroup extends ExpAuditing<String> {// implements Persistable<String> {

    @Id
    @Column(name = "group_code", length = 50)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 255)
    private String groupName;

    @Lob
    @Column(name = "ext_attributes")
    private String extAttributes;

    // @Transient
    // private boolean isPersisted;

    @Column(name = "is_system", nullable = false)
    private Integer system = 0;

    @Column(name = "is_active", nullable = false)
    private Integer active = 1;

    @Column(name = "is_deleted", nullable = false)
    private Integer deleted = 0;

    @Override
    public String getId() {
        return this.groupCode;
    }

}
