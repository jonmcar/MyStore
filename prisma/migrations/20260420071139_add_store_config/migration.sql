-- CreateTable
CREATE TABLE `StoreConfig` (
    `id` VARCHAR(30) NOT NULL DEFAULT 'singleton',
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
