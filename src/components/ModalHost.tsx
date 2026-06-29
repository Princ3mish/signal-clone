import { NewChatModal } from "./NewChatModal";
import { NewGroupModal } from "./NewGroupModal";
import { ProfileModal } from "./ProfileModal";
import { GroupInfoModal } from "./GroupInfoModal";

export function ModalHost() {
  return (
    <>
      <NewChatModal />
      <NewGroupModal />
      <ProfileModal />
      <GroupInfoModal />
    </>
  );
}
