import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  // Create default roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: { name: "super_admin", description: "Full system access" },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Administrative access" },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: { name: "editor", description: "Can edit and publish content" },
  });

  const reviewerRole = await prisma.role.upsert({
    where: { name: "reviewer" },
    update: {},
    create: { name: "reviewer", description: "Can review and approve content" },
  });

  const authorRole = await prisma.role.upsert({
    where: { name: "author" },
    update: {},
    create: { name: "author", description: "Can create and edit own content" },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: { name: "viewer", description: "Read-only access" },
  });

  // Create default permissions
  const permissionScopes = [
    "content.read",
    "content.create",
    "content.update",
    "content.publish",
    "content.archive",
    "content.delete",
    "media.manage",
    "taxonomy.manage",
    "settings.manage",
    "users.manage",
  ];

  for (const scope of permissionScopes) {
    await prisma.permission.upsert({
      where: { scope },
      update: {},
      create: { scope, name: scope.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") },
    });
  }

  // Assign all permissions to super_admin and admin
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Editor permissions
  const editorScopes = ["content.read", "content.create", "content.update", "content.publish", "content.archive", "media.manage", "taxonomy.manage"];
  const editorPerms = await prisma.permission.findMany({ where: { scope: { in: editorScopes } } });
  for (const perm of editorPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: editorRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: editorRole.id, permissionId: perm.id },
    });
  }

  // Reviewer permissions
  const reviewerScopes = ["content.read", "content.update", "content.publish", "content.archive"];
  const reviewerPerms = await prisma.permission.findMany({ where: { scope: { in: reviewerScopes } } });
  for (const perm of reviewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: reviewerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: reviewerRole.id, permissionId: perm.id },
    });
  }

  // Author permissions
  const authorScopes = ["content.read", "content.create", "content.update"];
  const authorPerms = await prisma.permission.findMany({ where: { scope: { in: authorScopes } } });
  for (const perm of authorPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: authorRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: authorRole.id, permissionId: perm.id },
    });
  }

  // Viewer permissions
  const viewerPermsList = await prisma.permission.findMany({ where: { scope: "content.read" } });
  for (const perm of viewerPermsList) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: perm.id },
    });
  }

  // Create default admin user
  const existingAdmin = await prisma.user.findUnique({ where: { email: "mmshfa@pulse.local" } });
  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        email: "mmshfa@pulse.local",
        passwordHash: await hashPassword("**removed**"),
        displayName: "Administrator",
        status: "active",
      },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: superAdminRole.id },
    });
    console.log("Created default admin user: mmshfa@pulse.local / **removed**");
  }

  // Create default content types
  await prisma.contentType.upsert({
    where: { slug: "blog_post" },
    update: {},
    create: {
      name: "Blog Post",
      slug: "blog_post",
      description: "Standard blog article",
      fields: JSON.stringify([
        { id: "title", type: "text", config: { label: "Title", validation: { required: true, maxLength: 120 } } },
        { id: "excerpt", type: "textarea", config: { label: "Excerpt", validation: { maxLength: 300 } } },
        { id: "eyebrow", type: "text", config: { label: "Eyebrow / Section Label", validation: { maxLength: 50 } } },
        { id: "featured", type: "boolean", config: { label: "Featured Post" } },
      ]),
      metadata: JSON.stringify({ icon: "file-text", color: "#3b82f6", sortField: "createdAt", sortDirection: "desc" }),
    },
  });

  await prisma.contentType.upsert({
    where: { slug: "landing_page" },
    update: {},
    create: {
      name: "Landing Page",
      slug: "landing_page",
      description: "Marketing landing page",
      fields: JSON.stringify([
        { id: "title", type: "text", config: { label: "Title", validation: { required: true } } },
        { id: "subtitle", type: "text", config: { label: "Subtitle" } },
      ]),
      metadata: JSON.stringify({ icon: "layout", color: "#10b981" }),
    },
  });

  await prisma.contentType.upsert({
    where: { slug: "site_setting" },
    update: {},
    create: {
      name: "Site Setting",
      slug: "site_setting",
      description: "Site-wide configuration entries",
      fields: JSON.stringify([
        { id: "value", type: "richtext", config: { label: "Value" } },
      ]),
      metadata: JSON.stringify({ icon: "settings", color: "#6b7280" }),
    },
  });

  // Seed default site settings
  const defaultSettings = [
    { key: "site.name", value: JSON.stringify("Pulse"), category: "general" },
    { key: "site.description", value: JSON.stringify("Pulse Content Platform"), category: "general" },
    { key: "seo.defaultTitle", value: JSON.stringify("Pulse — Content Platform"), category: "seo" },
    { key: "seo.defaultDescription", value: JSON.stringify("Pulse is a modern content platform."), category: "seo" },
    { key: "featured-tags", value: JSON.stringify(["design", "development", "ai", "strategy"]), category: "featured-tags" },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
