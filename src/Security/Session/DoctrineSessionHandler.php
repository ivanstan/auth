<?php

namespace App\Security\Session;

use App\Entity\Session;
use App\Entity\User;
use App\Repository\SessionRepository;
use App\Service\DateTimeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class DoctrineSessionHandler implements \SessionHandlerInterface
{
    protected EntityManagerInterface $em;
    protected TokenStorageInterface $token;
    protected RequestStack $requestStack;
    protected SessionRepository $repository;

    public function __construct(EntityManagerInterface $em, TokenStorageInterface $token, RequestStack $requestStack)
    {
        $this->em = $em;
        $this->token = $token;
        $this->requestStack = $requestStack;
        $this->repository = $this->em->getRepository(Session::class);
    }

    public function close(): bool
    {
        return true;
    }

    public function destroy($id): bool
    {
        $this->repository->remove($id);

        return true;
    }

    public function gc($seconds): bool
    {
        $this->repository->purge();

        return true;
    }

    public function open($path, $id): bool
    {
        return true;
    }

    public function read($id)
    {
        $session = $this->repository->get($id);

        if (!$session || $session->getData() === null) {
            return '';
        }

        $resource = $session->getData();

        return \is_resource($resource) ? stream_get_contents($resource) : $resource;
    }

    public function write($id, $data): bool
    {
        $lifeTime = (int)ini_get('session.gc_maxlifetime');

        $interval = new \DateInterval('PT' . $lifeTime . 'S');

        $session = $this->repository->get($id);

        $session->setData($data);
        $session->setDate(DateTimeService::getCurrentUTC());
        $session->setLifetime($interval);
        $session->setUser($this->getUser());

        if ($request = $this->requestStack->getMasterRequest()) {
            $session->setIp($request->getClientIp());
            $session->setUserAgent($request->headers->get('User-Agent'));
        }

        $this->em->persist($session);
        $this->em->flush();

        return true;
    }

    private function getUser(): ?User
    {
        if ($this->token->getToken() === null) {
            return null;
        }

        $user = $this->token->getToken()->getUser();

        if (!$user instanceof User) {
            return null;
        }

        return $user;
    }
}
