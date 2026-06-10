package com.fis.vdbas.exp.api.category;

import com.fis.vdbas.exp.application.category.dto.CategoryDto;
import com.fis.vdbas.exp.application.category.dto.CategorySearchDto;
import com.fis.vdbas.exp.application.category.dto.CategoryTreeDto;
import com.fis.vdbas.exp.application.category.service.CategoryService;
import com.fis.vdbas.common.dto.PageResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    /**
     * GET /api/categories/group/{groupCode}
     * Returns all active items in the group as a flat list, ordered by orderIndex.
     */
    @GetMapping("/group/{groupCode}")
    public List<CategoryDto> findAllByGroupCode(@PathVariable String groupCode) {
        return service.findAllByGroupCode(groupCode);
    }

    /**
     * GET /api/categories/group/{groupCode}/tree
     * Returns the full hierarchy tree for a group.
     * Items without a parent become root nodes; children are nested inside.
     */
    @GetMapping("/group/{groupCode}/tree")
    public List<CategoryTreeDto> findTreeByGroupCode(@PathVariable String groupCode) {
        return service.findTreeByGroupCode(groupCode);
    }

    /**
     * GET /api/categories/{id}
     */
    @GetMapping("/{id}")
    public CategoryDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * POST /api/categories/search
     * Paginated + filtered search across all groups or scoped to a specific groupCode.
     */
    @PostMapping("/search")
    public PageResponseDto<CategoryDto> search(@RequestBody CategorySearchDto body) {
        return service.search(body);
    }

    /**
     * POST /api/categories  →  201 Created
     * catLevel and catPath are computed from parentId — never supplied by the client.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryDto body) {
        return service.create(body);
    }

    /**
     * PUT /api/categories/{id}  →  200 OK
     */
    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable UUID id, @Valid @RequestBody CategoryDto body) {
        return service.update(id, body);
    }

    /**
     * DELETE /api/categories/{id}  →  204 No Content
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
