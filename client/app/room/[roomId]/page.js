import GameLobby from "@/components/RoomPage/GameLobby";

const page = async ({
    params,
}) => {
    const { roomId } = await params;
    return (
        <div className="h-screen overflow-hidden">
            <GameLobby
                roomId={roomId}
            />
        </div>
    )
}

export default page
