package com.fis.vdbas.exp.api.masterdata;

import com.fis.vdbas.exp.application.masterdata.dto.*;
import com.fis.vdbas.exp.application.masterdata.service.MasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/master-data")
@RequiredArgsConstructor
public class MasterDataController {

    private final MasterDataService service;

    @GetMapping("/projects")
    public List<ProjectInfoDto> getProjects(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name) {
        return service.getProjects(code, name);
    }

    @GetMapping("/treasury")
    public List<TreasuryInfoDto> getTreasuries(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name) {
        return service.getTreasuries(code, name);
    }

    @GetMapping("/payment-types")
    public List<PaymentTypeDto> getPaymentTypes() {
        return service.getPaymentTypes();
    }

    @GetMapping("/capital-plan-types")
    public List<CodeNameDto> getCapitalPlanTypes() {
        return service.getCapitalPlanTypes();
    }

    @GetMapping("/currency-types")
    public List<CodeNameDto> getCurrencyTypes() {
        return service.getCurrencyTypes();
    }

    @GetMapping("/exchange-rate-types")
    public List<CodeNameDto> getExchangeRateTypes() {
        return service.getExchangeRateTypes();
    }

    @GetMapping("/document-types")
    public List<DocumentTypeDto> getDocumentTypes() {
        return service.getDocumentTypes();
    }

    @GetMapping("/investment-sources")
    public List<InvestmentSourceDto> getInvestmentSources(
            @RequestParam(required = false) String segmentCode) {
        return service.getInvestmentSources(segmentCode);
    }

    @GetMapping("/allocation-criteria")
    public List<CodeNameDto> getAllocationCriteria() {
        return service.getAllocationCriteria();
    }

    @GetMapping("/project-items")
    public List<CodeNameDto> getProjectItems(
            @RequestParam(required = false) String projectCode) {
        return service.getProjectItems(projectCode);
    }

    @GetMapping("/gl-segments/{segmentNo}")
    public List<CodeNameDto> getGlSegments(@PathVariable int segmentNo) {
        return service.getGlSegments(segmentNo);
    }

    @GetMapping("/guarantees")
    public List<GuaranteeDto> getGuarantees(
            @RequestParam(required = false) String guaranteeNo) {
        return service.getGuarantees(guaranteeNo);
    }

    @GetMapping("/states")
    public List<CodeNameDto> getStates() {
        return service.getStates();
    }
}
