import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import Image from 'next/image';
import { capitalizeFirst } from '@/utils/utils';

const MessageBox = ({
    SenderName, message, isOwnMessage
}) => {

    const avatar = createAvatar(bottts, {
        seed: SenderName,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"]
    });

    const image = avatar.toDataUri();

    return (
        <div className='flex items-start gap-2'>
            <div>
                <Image
                    src={image}
                    width={25}
                    height={25}
                    className='rounded-full'
                    alt={SenderName}
                />
            </div>
            <div className='flex-1 min-w-0'>
                <p className='font-bold text-sm text-blue-300'>
                    {capitalizeFirst(SenderName)}
                    {
                        isOwnMessage &&
                        <span className='pl-1 text-white text-xs'>
                            ( You )
                        </span>
                    }
                </p>
                <p className='text-sm text-white wrap-break-word'>{message}</p>
            </div>
        </div>
    )
}

export default MessageBox
