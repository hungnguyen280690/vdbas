package com.fis.vdbas.exp.api.lov;

import com.fis.vdbas.exp.application.lov.dto.AttachmentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.CurrencyItem;
import com.fis.vdbas.exp.application.lov.dto.DataSourceItem;
import com.fis.vdbas.exp.application.lov.dto.DocumentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.DossierTypeItem;
import com.fis.vdbas.exp.application.lov.dto.OrganizationLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectSpecificLovItem;
import com.fis.vdbas.exp.application.lov.dto.TreasuryLovItem;
import com.fis.vdbas.exp.application.lov.service.LovService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Danh mục tra cứu (LOV) — {@code /api/v1/lov/*}. */
@RestController
@RequestMapping("/api/v1/lov")
@RequiredArgsConstructor
public class LovController {

    private final LovService service;

    @GetMapping("/projects")
    public List<ProjectLovItem> projects(
            @RequestParam(required = false) String projectCode,
            @RequestParam(required = false) String projectName,
            @RequestParam(required = false) String projectTypeCode) {
        return service.projects(projectCode, projectName, projectTypeCode);
    }

    @GetMapping("/projects/{projectCode}/specific")
    public List<ProjectSpecificLovItem> projectSpecific(@PathVariable String projectCode) {
        return service.projectSpecific(projectCode);
    }

    @GetMapping("/treasuries")
    public List<TreasuryLovItem> treasuries(@RequestParam(required = false) String search) {
        return service.treasuries(search);
    }

    @GetMapping("/organizations")
    public List<OrganizationLovItem> organizations(@RequestParam(required = false) String search) {
        return service.organizations(search);
    }

    @GetMapping("/data-sources")
    public List<DataSourceItem> dataSources() {
        return service.dataSources();
    }

    @GetMapping("/document-types")
    public List<DocumentTypeItem> documentTypes() {
        return service.documentTypes();
    }

    @GetMapping("/attachment-types")
    public List<AttachmentTypeItem> attachmentTypes() {
        return service.attachmentTypes();
    }

    /** GAP-11: Loại hồ sơ (CAPEX/OPEX). */
    @GetMapping("/dossier-types")
    public List<DossierTypeItem> dossierTypes() {
        return service.dossierTypes();
    }

    /** GAP-08/11: Loại tiền (tĩnh VND/USD). */
    @GetMapping("/currencies")
    public List<CurrencyItem> currencies(@RequestParam(required = false) String search) {
        return service.currencies(search);
    }
}
