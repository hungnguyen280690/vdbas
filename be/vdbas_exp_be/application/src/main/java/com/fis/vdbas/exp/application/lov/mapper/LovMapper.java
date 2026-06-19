package com.fis.vdbas.exp.application.lov.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.exp.application.lov.dto.AttachmentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.DataSourceItem;
import com.fis.vdbas.exp.application.lov.dto.DocumentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.DossierTypeItem;
import com.fis.vdbas.exp.application.lov.dto.OrganizationLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectSpecificLovItem;
import com.fis.vdbas.exp.application.lov.dto.TreasuryLovItem;
import com.fis.vdbas.exp.domain.lov.CommonOrganization;
import com.fis.vdbas.exp.domain.lov.CommonTreasury;
import com.fis.vdbas.exp.domain.lov.ExpAttachmentType;
import com.fis.vdbas.exp.domain.lov.ExpDataSource;
import com.fis.vdbas.exp.domain.lov.ExpDocumentType;
import com.fis.vdbas.exp.domain.lov.ExpDossierType;
import com.fis.vdbas.exp.domain.lov.ExpProject;
import com.fis.vdbas.exp.domain.lov.ExpProjectSpecific;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/** MapStruct mapper cho các entity LOV → item DTO. */
@Mapper(componentModel = "spring")
public interface LovMapper extends BooleanIntegerMapper {

    // hasSpecific: Integer (entity) → Boolean (dto) qua integerToBoolean() của BooleanIntegerMapper
    @Mapping(target = "hasSpecific", source = "hasSpecific")
    ProjectLovItem toProjectLovItem(ExpProject entity);

    List<ProjectLovItem> toProjectLovItemList(List<ExpProject> entities);

    ProjectSpecificLovItem toProjectSpecificLovItem(ExpProjectSpecific entity);

    List<ProjectSpecificLovItem> toProjectSpecificLovItemList(List<ExpProjectSpecific> entities);

    TreasuryLovItem toTreasuryLovItem(CommonTreasury entity);

    List<TreasuryLovItem> toTreasuryLovItemList(List<CommonTreasury> entities);

    OrganizationLovItem toOrganizationLovItem(CommonOrganization entity);

    List<OrganizationLovItem> toOrganizationLovItemList(List<CommonOrganization> entities);

    @Mapping(target = "code", source = "dataSourceCode")
    @Mapping(target = "name", source = "dataSourceName")
    @Mapping(target = "isDefault", source = "isDefault")
    DataSourceItem toDataSourceItem(ExpDataSource entity);

    List<DataSourceItem> toDataSourceItemList(List<ExpDataSource> entities);

    DocumentTypeItem toDocumentTypeItem(ExpDocumentType entity);

    List<DocumentTypeItem> toDocumentTypeItemList(List<ExpDocumentType> entities);

    DossierTypeItem toDossierTypeItem(ExpDossierType entity);

    List<DossierTypeItem> toDossierTypeItemList(List<ExpDossierType> entities);

    AttachmentTypeItem toAttachmentTypeItem(ExpAttachmentType entity);

    List<AttachmentTypeItem> toAttachmentTypeItemList(List<ExpAttachmentType> entities);
}
