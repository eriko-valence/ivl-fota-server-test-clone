CREATE TABLE [dbo].[DeviceGroup] (
    [Id]                INT         NOT NULL,
    [Name]              NCHAR (100) NULL,
    [DesiredFirmwareId] INT         NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_DeviceGroup_Firmware] FOREIGN KEY ([DesiredFirmwareId]) REFERENCES [dbo].[DeviceFirmware] ([Id])
);

