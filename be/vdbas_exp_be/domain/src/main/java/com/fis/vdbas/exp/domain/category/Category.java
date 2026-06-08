package com.fis.vdbas.exp.domain.category;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.fis.vdbas.common.domain.AbstractAuditing;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import jakarta.persistence.Lob;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Category extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    /**
     * Trường dữ liệu lớn, map dạng CLOB cho Oracle.
     */
    @Lob
    @Column(name = "ext_attributes")
    private String extAttributes;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_deleted", nullable = false)
    private Integer deleted = 0;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "cat_level")
    private Integer catLevel = 1;

    @Column(name = "cat_path", length = 2000)
    private String catPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_code", referencedColumnName = "group_code", insertable = false, updatable = false)
    private CategoryGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private Category parent;
}
