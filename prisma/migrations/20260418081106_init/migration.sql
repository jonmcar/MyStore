-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_slug_idx`(`slug`),
    INDEX `Category_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Listing` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `tagline` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `priceCents` INTEGER NOT NULL,
    `compareAtCents` INTEGER NULL,
    `images` JSON NOT NULL,
    `tags` JSON NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `inStock` BOOLEAN NOT NULL DEFAULT true,
    `availability` VARCHAR(20) NULL,
    `processingTime` VARCHAR(200) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `sku` VARCHAR(80) NULL,
    `weightGrams` INTEGER NULL,
    `stockCount` INTEGER NULL,
    `durationMinutes` INTEGER NULL,
    `locationType` VARCHAR(20) NULL,
    `locationLabel` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publishedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Listing_slug_key`(`slug`),
    INDEX `Listing_slug_idx`(`slug`),
    INDEX `Listing_categoryId_idx`(`categoryId`),
    INDEX `Listing_isPublished_featured_idx`(`isPublished`, `featured`),
    INDEX `Listing_type_idx`(`type`),
    INDEX `Listing_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingOption` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `helpText` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `config` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ListingOption_listingId_sortOrder_idx`(`listingId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ListingOptionChoice` (
    `id` VARCHAR(191) NOT NULL,
    `optionId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `priceModifierCents` INTEGER NULL,
    `stockCount` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ListingOptionChoice_optionId_sortOrder_idx`(`optionId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'placed',
    `statusUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotalCents` INTEGER NOT NULL,
    `discountCents` INTEGER NOT NULL DEFAULT 0,
    `appliedDiscount` JSON NULL,
    `taxCents` INTEGER NOT NULL,
    `shippingCents` INTEGER NOT NULL,
    `totalCents` INTEGER NOT NULL,
    `shippingAddress` JSON NULL,
    `notes` TEXT NULL,
    `customerNotes` TEXT NULL,
    `placedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_email_idx`(`email`),
    INDEX `Order_status_placedAt_idx`(`status`, `placedAt`),
    INDEX `Order_placedAt_idx`(`placedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(30) NOT NULL,
    `listingSlug` VARCHAR(200) NOT NULL,
    `listingType` VARCHAR(20) NOT NULL,
    `nameAtAdd` VARCHAR(255) NOT NULL,
    `imageAtAdd` VARCHAR(500) NULL,
    `priceCentsAtAdd` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `selectedOptions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscountCode` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `kind` VARCHAR(10) NOT NULL,
    `amount` INTEGER NOT NULL,
    `minSubtotalCents` INTEGER NULL,
    `expiresAt` DATETIME(3) NULL,
    `usageLimit` INTEGER NULL,
    `timesUsed` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiscountCode_code_key`(`code`),
    INDEX `DiscountCode_code_idx`(`code`),
    INDEX `DiscountCode_active_expiresAt_idx`(`active`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorefrontContent` (
    `id` VARCHAR(30) NOT NULL DEFAULT 'singleton',
    `sections` JSON NOT NULL,
    `announcement` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Listing` ADD CONSTRAINT `Listing_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingOption` ADD CONSTRAINT `ListingOption_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListingOptionChoice` ADD CONSTRAINT `ListingOptionChoice_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `ListingOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
