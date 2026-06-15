package com.fis.vdbas.exp.application.masterdata.mapper;

import com.fis.vdbas.exp.application.masterdata.dto.*;
import com.fis.vdbas.exp.domain.masterdata.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MasterDataMapper {

    ProjectInfoDto toProjectInfoDto(ExpProject entity);
    List<ProjectInfoDto> toProjectInfoDtoList(List<ExpProject> list);

    ProjectManagementInfoDto toProjectManagementInfoDto(ExpProjectManagement entity);
    List<ProjectManagementInfoDto> toProjectManagementInfoDtoList(List<ExpProjectManagement> list);

    TreasuryInfoDto toTreasuryInfoDto(CommonTreasury entity);
    List<TreasuryInfoDto> toTreasuryInfoDtoList(List<CommonTreasury> list);

    DocumentTypeDto toDocumentTypeDto(ExpDocumentType entity);
    List<DocumentTypeDto> toDocumentTypeDtoList(List<ExpDocumentType> list);

    PaymentTypeDto toPaymentTypeDto(ExpPaymentType entity);
    List<PaymentTypeDto> toPaymentTypeDtoList(List<ExpPaymentType> list);

    @Mapping(source = "capitalPlanTypeCode", target = "code")
    @Mapping(source = "capitalPlanTypeName", target = "name")
    CodeNameDto toCapitalPlanTypeDto(ExpCapitalPlanType entity);

    @Mapping(source = "currencyTypeCode", target = "code")
    @Mapping(source = "currencyTypeName", target = "name")
    CodeNameDto toCurrencyTypeDto(ExpCurrencyType entity);

    @Mapping(source = "exchangeRateTypeCode", target = "code")
    @Mapping(source = "exchangeRateTypeName", target = "name")
    CodeNameDto toExchangeRateTypeDto(ExpExchangeRateType entity);

    @Mapping(source = "allocationCriteriaCode", target = "code")
    @Mapping(source = "allocationCriteriaName", target = "name")
    CodeNameDto toAllocationCriteriaDto(CommonAllocationCriteria entity);

    @Mapping(source = "projectItemCode", target = "code")
    @Mapping(source = "projectItemName", target = "name")
    CodeNameDto toProjectItemDto(ExpProjectItem entity);

    @Mapping(source = "stateCode", target = "code")
    @Mapping(source = "stateName", target = "name")
    CodeNameDto toStateDto(CommonState entity);

    @Mapping(source = "investmentSourceCode", target = "code")
    @Mapping(source = "investmentSourceName", target = "name")
    InvestmentSourceDto toInvestmentSourceDto(CommonInvestmentSource entity);

    GuaranteeDto toGuaranteeDto(ExpGuarantee entity);
    List<GuaranteeDto> toGuaranteeDtoList(List<ExpGuarantee> list);
}
