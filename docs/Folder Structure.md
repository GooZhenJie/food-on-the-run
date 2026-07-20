```
docs/
└── <branch_name>/                     # 建议与实际 git 分支名一致
	# 仅多仓库 workspace 需要；单仓库项目省略这一层，
    ├── ticket/
    # ticket 直接归到下面某个分类目录（如 references/）
    │   └── {ticket_id}.md             
    │
    # 仅多仓库 workspace 需要；单仓库项目省略这一层，
    └── [<repo_name>/]
        │                              #   分类目录直接挂在 <branch_name>/ 下
        ├── README.md                  # 可选，一句话概述该分支在这个仓库里做了什么
        ├── prompts/
        │   └── r{n}[.{lang}][-v{n}].md
        ├── analysis/
        │   └── {topic-kebab-case}.md
        ├── references/
        │   └── ...                    # 保留原始文件名，或 {topic-kebab-case}.md
        ├── reviews/
        │   └── review-{topic-kebab-case}-{YYYY-MM-DD}.md
        ├── test-cases/
        │   └── tc-{feature-kebab-case}.md
        ├── sessions/
        │   └── {YYYY-MM-DD}-{repo_name}-{topic-kebab-case}[-iter{n}].md
        ├── memory/
        │   └── {topic-kebab-case}.md
        └── assets/
            └── r{n}.image{m}.{ext} 或 {topic-kebab-case}-{n}.{ext}
```