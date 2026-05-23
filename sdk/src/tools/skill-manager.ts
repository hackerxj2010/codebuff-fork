import fs from 'fs'
import path from 'path'
import { isValidSkillName, isValidSkillDescription, SKILLS_DIR_NAME, SKILL_FILE_NAME } from '@codebuff/common/constants/skills'

const AGENTS_DIR = '.agents'

export type SkillManagerResult = {
  success: boolean
  operation: 'create' | 'delete' | 'list' | 'validate' | 'show'
  message: string
  skill?: { name: string; description: string; content?: string }
  skills?: Array<{ name: string; description: string; exists: boolean }>
}

function getSkillsDir(): string {
  return path.join(process.cwd(), AGENTS_DIR, SKILLS_DIR_NAME)
}

function getSkillFilePath(name: string): string {
  return path.join(getSkillsDir(), name, SKILL_FILE_NAME)
}

function listSkills(): Array<{ name: string; description: string; exists: boolean }> {
  const skillsDir = getSkillsDir()
  try {
    if (!fs.existsSync(skillsDir)) return []
    const items = fs.readdirSync(skillsDir, { withFileTypes: true })
    const skills: Array<{ name: string; description: string; exists: boolean }> = []
    for (const item of items) {
      if (item.isDirectory()) {
        const skillFilePath = path.join(skillsDir, item.name, SKILL_FILE_NAME)
        if (fs.existsSync(skillFilePath)) {
          const content = fs.readFileSync(skillFilePath, 'utf-8')
          const descMatch = content.match(/description:\s*(.+)/)
          const description = descMatch ? descMatch[1].trim() : 'No description'
          skills.push({ name: item.name, description, exists: true })
        }
      }
    }
    return skills
  } catch {
    return []
  }
}

export async function skillManagerTool(params: {
  operation: 'create' | 'delete' | 'list' | 'validate' | 'show'
  name?: string
  description?: string
  content?: string
  overwrite?: boolean
}): Promise<SkillManagerResult> {
  const { operation, name, description, content, overwrite } = params

  switch (operation) {
    case 'create': {
      if (!name || !description || !content) {
        return {
          success: false,
          operation,
          message: 'name, description, and content are required for create operation.',
        }
      }

      if (!isValidSkillName(name)) {
        return {
          success: false,
          operation,
          message: `Invalid skill name: "${name}". Must be lowercase alphanumeric with single hyphens.`,
        }
      }

      if (!isValidSkillDescription(description)) {
        return {
          success: false,
          operation,
          message: 'Invalid description. Must be 1-1024 characters.',
        }
      }

      const skillFilePath = getSkillFilePath(name)
      if (fs.existsSync(skillFilePath) && !overwrite) {
        return {
          success: false,
          operation,
          message: `Skill "${name}" already exists. Use overwrite: true to replace it.`,
          skill: { name, description },
        }
      }

      const skillDir = path.dirname(skillFilePath)
      fs.mkdirSync(skillDir, { recursive: true })

      const skillContent = `---
name: "${name}"
description: "${description}"
---

# ${name}

${content}`
      fs.writeFileSync(skillFilePath, skillContent, 'utf-8')

      return {
        success: true,
        operation,
        message: `Skill "${name}" created successfully.`,
        skill: { name, description, content: skillContent },
      }
    }

    case 'delete': {
      if (!name) {
        return { success: false, operation, message: 'name is required for delete.' }
      }
      const skillFilePath = getSkillFilePath(name)
      if (!fs.existsSync(skillFilePath)) {
        return { success: false, operation, message: `Skill "${name}" not found.` }
      }
      fs.rmSync(path.dirname(skillFilePath), { recursive: true, force: true })
      return { success: true, operation, message: `Skill "${name}" deleted.` }
    }

    case 'list': {
      const skills = listSkills()
      return {
        success: true,
        operation,
        message: skills.length > 0
          ? `Found ${skills.length} skill(s) in registry.`
          : 'No skills found in registry.',
        skills,
      }
    }

    case 'validate': {
      if (!name) {
        return { success: false, operation, message: 'name is required for validate.' }
      }
      const nameValid = isValidSkillName(name)
      const descValid = description ? isValidSkillDescription(description) : true
      const issues: string[] = []
      if (!nameValid) issues.push('Name must be lowercase alphanumeric with single hyphens (max 64 chars)')
      if (description && !descValid) issues.push('Description must be 1-1024 characters')
      if (issues.length === 0) {
        return { success: true, operation, message: `Skill "${name}" is valid.`, skill: { name, description: description ?? '' } }
      }
      return { success: false, operation, message: `Validation failed:\n- ${issues.join('\n- ')}`, skill: { name, description: description ?? '' } }
    }

    case 'show': {
      if (!name) {
        return { success: false, operation, message: 'name is required for show.' }
      }
      const skillFilePath = getSkillFilePath(name)
      if (!fs.existsSync(skillFilePath)) {
        return { success: false, operation, message: `Skill "${name}" not found.` }
      }
      const fullContent = fs.readFileSync(skillFilePath, 'utf-8')
      const descMatch = fullContent.match(/description:\s*(.+)/)
      const skillDescription = descMatch ? descMatch[1].trim() : ''
      return {
        success: true,
        operation,
        message: `Skill "${name}" loaded.`,
        skill: { name, description: skillDescription, content: fullContent },
      }
    }

    default: {
      return {
        success: false,
        operation: operation as 'list',
        message: `Unknown operation: "${String(operation)}". Supported: create, delete, list, validate, show.`,
      }
    }
  }
}
